---
layout:      page
title:       test blog
sitemap:     false
image: /assets/img/ITCcheck1.jpeg
description: >
    The Information Technology Competition (ITC) is a penetration testing competition where groups of up to five people form a pseudo pentesting company and compete based on findings, report writing, and presentation. In this comptition our team, Iterative Security, was given the opportunity to gain real world experience in pentesting and explore the insecurities of Active Directory, common misconfigurations, and AI
---

<!--Adds the glitch effect -->
<section>

  <link rel="stylesheet" href="/style.css">
  <div class="hero-container">
	<h1 class="hero glitch layers" data-text="Information Technology Competition (ITC)" style="position: absolute; top: 5px; left: 0px;">
  	<span>Information Technology Competition (ITC)</span></h1>
  </div>

</section>
<!--this css code will fix all color issues -->
<link rel="stylesheet" href="/hydejack-9.1.6.css">

![ITC group photo](/assets/img/ITCgroup.jpeg)

{:toc}

## About the Team
---

Our team is composed of five members. Our team leader, Gerardo (Jerry) Solis, Luke Kimes, Charles Trouilliere, Daniel Wang, and me. Our team leader Jerry created came up with the company name Iterative Security due to this passion for programming. He wanted to combine coding and security as they are closely related. As a result, he came up with Iterative Security because in programming, you can make loops that use iterations such as i++. This is also how we came up with our slogan, "We make your security stronger by each iteration."

Our team was separated into different roles throughout the competition. Jerry was in charge of the AI pentesting, while I handled the network side. Unforturnatly, due to schedule conflicts, our other members weren't able to do much pentesting. However, this is by no means to downplay their efforts in the competition. They were invaluable teammates when it came to the organization of the team and the report writing, which I will have links to at the end. I recommend reading the blog with the final report open. 


## Overview of the Competition
---

As you may have read from the description, this competition is a pentesting simulation where teams create their own company and have to conduct a full, professional pentest on a fake company. This environment included various trending and unique systems such as:

- Active Directory
- Artificial Intelligence (Specter AI)
- Linux Hosting GitLab
- A Tram
- Segmented Networks (CORP and RND)

While our team wasn't able to compromise the entire system during the competition, we were able to gain full admin access to 7/9 machines given to us. The methodology of our team wasn't for stealth. We essentially did whatever it took to gain access to the network. This approach obviously wouldn't pass in the real world, but it was a good learning experience in understanding what can and can't be done. 


## Corporate Network 
---

### Kiosk (Linux - 192.168.10.50)

Starting with the KIOSK machine, we did an nmap scan on this network and noticed that http and ftp ports were open. As any typical pentester, I tetsed for anonymous users, which was a success. I was able to login anonymously and get a zip file. This zip file was password protected so I used the tool zip2john to output the hash into a file, which we then send through john the ripper. 

I forgot the password was, but it was a very simple password and easy to crack using the rockyou.txt wordlist. This gave us access to the Visitor user to the website running Specter AI. We were then able to escalate our privileges on the website with various prompt and sql injections. There were three accounts on the AI website. Visitor, Researcher, and Technician. As ou may expect, the Technician had the highets privileges. 

Once we got access to the Technician account, we were able to perform remote code execution and give us a reverse shell to the Kiosk computer itself. However, the shell was very unstable and frustrating to use. So, we spawned our own shell by using the command "python3 -c ‘import pty;pty.spawn("/bin/bash")". This is a much more stable shell and allowed for better control over the computer. 

![Kiosk reverse shell](/assets/img/Kisok-rev.jpeg)

After this, we downlaoded and ran LinEnum. We found an executable file called specter-analytics.sh. This contained an environment variable called $SPECTER_AI_TOOL. We reconfigured this to spawn a reverse shell. When we run the file with sudo permissions we were able to gain root. 

This wasn't my area of the pentest, however, if you would like to learn more about this section, feel free to contact our team leader through discord: jsoulis or [LinkedIN](https://www.linkedin.com/in/gerardosolisit/)


### Domain Controller (Windows Server - 192.168.10.5)

The domain controller was our main attacking point and is what got us access to every machine on the network. We started off with the typical nmap scan using the flags -sV -sC -vv. This gave us a long and comprehensive report on what ports are open and data like NetBios Name, domain name, and so on. You can view these at the very bottom of the report. I also used a tool called kerbrute to enumerate users over kerberos. This gave me almost all of the users on the network. 

The initial access gave us trouble at the very beginning because there wasn't much that was misconfogured at first glance. No anonymous logins, no permissions for rpcclient enumeration, no asreproasting, and so on. However, I scanned the network using Nessus and was able to find a very valuable vulnerability called ZeroLogon. This exxploit has become my favorite due to how common it is and how easy it is to execute. 

However, the downside of this vulnerabiltiy is that it breaks the active directory a bit. What ZeroLogon does is it essentially resets all hashes on the domain controller to null. This would allow anyone to login with a blank password. So, by using the impacket tool "secretsdump", we're able to retrieve the hashes of all users on the domain and login through evil-winrm by performing a pass the hash. But the bad thing about this is that user may not be able to log in for some time until I restore the passwords. They obviously went after me duirng the presentation because of this, but it was still a good experience in understanding what I shouldn't do. 

To achieve persistence, I identified the local admin of each computer and logged into that user. In this case the Administrator user. After that, I created my own user called "admin" and created an RDP backdoor. Now, one of the feedback I got was the use of the word backdoors during the presentation. The judges didn't like it becasue when people hear of backdoors, they think of a malicious software and such. While the term was correctly used, it's better to say persistence in such scenarios. 

The final finding on the Domain Controller was the plain text passwords in the recycle bin. Because the computer had RDP open, we were able to RDP into the administrator user and have a GUI. This allowed us to find files that would be difficult or tedious to find otherwise. However, when we tested the credentials on the RND network, none of them worked. So these were probably default passwords the company used for new users. If you go to the Low Findings section, you will see the summary of the finding. 


### Files (Windows 10 - 192.168.10.10)

The Files machine was interesting. It didn't seem like there was much upon initial exploit, but it actually had quite a bit. 

When we ran secretsdump on the DC, it also spit out some plain text credentials for the rlopez user. This user was the local admin for the Files computer and the Router. He reused his password multiple times which is also how we got into the router. 

The funny thing about this machine is that we realized we went about the whole competition the wrong way. rlopez has a really weak password. So, it's possible that we could've used tools like Hydra to bruteforce credentials over rdp. We then would've went in a chain from Files to Win10 to router to DC. At least that's how other teams did it. 

The reason why we would go to Win10 is because there was a folder in the C:\ directory called Corp-Files. This folder contained a password protected audit.zip file. When extracted using zip2john and john the ripper, We could see all of the audits and lore that the company had. A link to the lore files will be mentioned at the end. 

Anyways, one of the files contained the default credentials for janderson. One of the users I enumerated through kerbrute. Using this, one could RDP into janderson, who would turn out to be a local admin on the Win10 machine. However, I didn't need to do this because I had admin privileges with ZeroLogon. 

Other than this, there wasn't much else about this machine.


### Windows 10 (Windows 10 - 192.168.10.20)

There really wasn't anything on the Win10 machine. There was no need for privilege escalation because of ZeroLogon and the audit file from the Files machine. After the update report we did notice that the password for janderson changed. So, we couldn't rdp into him anymore. However, that wasn't an issue since we had persistence on the machine

As I mentioned before, janderson was the local admin of the Win10 machine. Upon crawling around we noticed that he had an ssh known_hosts file leading to the GitLab box, however he didn't have any ssh keys, so we couldn't do anything with that information. 

But yeah, Win10 was an empty box. 


### Router (Linux - 192.168.0.1)

For the router, I mentioned earlier that rlopez used the same password multiple times. Well, the router was running a pfsense webpage on port 80, and to log in, we used rlopez's password, and it worked. 

What other teams did was they changed the firewall rules so that they would allow their kali machines to connect to the RND network. This would get rid of the need for proxychains or having to pentest from a windows computer. We didn't think about doing this becasue we didn't want to break the network in any way. However, during the feedback session, they urged us to be more open with our employers becasue that's a big part of pentesting, which I agree with. I think if we were more open and asked if we could change the firewall rules, we could've done much more on the RND network. 

Another thing the other teams found was the administrator password for the DC within the pfsense. Apparently it was just laying there in plain text, but I never saw it. This is obviously a high risk vulnerability due to the weak password of rlopez and the plain text credentials. This would have been a good finding for our report. 


## Research and Development Network
---

Our team wasn't able to do anything significant on the RND network, so I will summarize everything I know and did on this network. 

I conducted the active reconaissance phase by downloaded nmap on the CORP DC machine using the same flags as before. (-sV -sC -vv). This gave some interesting information, but nothing significant. A lot of useful ports were closed and configured correctly such as RDP and rpc. 

Once we were able to get root access to the Kiosk machine, I downloaded the necessary tools for ZeroLogon and executed it on the RND network. I then restored the passwords as soon as I got what I needed. Becasue we didn't change the firewall rules, all of our attacks had to be done over proxychains or on the Kiosk machine itself. This led to many limitations like the exclusion of Nessus, trouble with metasploit, and so on. While we took the harder way compared to other teams, I feel that we learned a lot more becasue we had to face these challenges. I learned how to use tools like chisel, hosting a temporary smb server, sliver, remmina, nessus, etc. Overall, we were only able to access the CA and DC machines on the RND network. 

Other teams reconfigrued the firewall as I mentioned before. This allowed them to use tools like metasploit. What they did was they used the exploit/multi/http/gitlab_exif_rce module from metasploit. This allowed fro remote code execution and gave them shell access to the GitLab machine. 

They said that this machine was like a gold mine of information, however we don't know what was inside there. The other thing they did was on the tram website, there was a post-it note that had ssh credentials for the tram. Again, we never got into the tram, so we don't know what was in there. The other team mentioned that at the end, they were able to control the tram's movement such as thrusters, scheduling, and such. 

This all would've been so fun to see for ourselves, but we just haven't had time to contiue the pentest after the competition. 


## Conclusion
---

Overall, this was a really fun competiton. It gave me real world experience and understanding in what to expect, what I should focus on learning, how to write a report, what my weaknesses are, etc. I really enjoyed the competiton. Even though we didn't compromise everything, I believe the team did a great job as beginner pentesters with minimal experience. 

If other schools have the opportunity to compete in such a competiton, I say do it even if it costs $50 per person. This was a valuable experience that will push me forward in my pentesting journey, and I hope others will have a chance to compete in this competition. 


## Report Links

- [Report (pdf download link)](https://cdn.discordapp.com/attachments/1222369736889733173/1233662035103977503/PNVI_FINALREPORT.pdf?ex=66522a0d&is=6650d88d&hm=365517af0d88bc6fe14138d3ffbb402844a0901db612ae240126c390f124bd03&) 
- [Lore](https://docs.google.com/document/d/1zWjrjKb685FCOKeRdAqe9yQVZQX4VnGAuN3ybLTRqyU/edit?usp=sharing)
- [Presentation](https://drive.google.com/file/d/1fMeWrGA4RB5VzhXi8jQ9Tm4X-sigvH7W/view)
- [Slides](https://docs.google.com/presentation/d/1G7GI5F9aia3uc9RJq9NI5CzXfdzXVo31q3MykyJ8uY8/edit?usp=sharing)
