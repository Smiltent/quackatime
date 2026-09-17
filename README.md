<h1 align="center">Quackatime</h1>
<p align="center"><em>a WakaTime-compatible backend for coding statistics that Quacks</em></p>
<img src="_header.png">

# About
An alternative to WakaTime, which you can self-host!  
Hugely insprired by WakaTime and [Hackatime](https://github.com/hackclub/hackatime) (helped me figure out the API endpoints).  

# Public test instance
You can try out Hackatime on the public test instance!  
https://quackati.me

# Features
* [x] Tracking Time
* [x] Leaderboards (Daily, Weekly)
* [x] Project viewing

# Planned Features
This is just a small list that I want to implement into this. Some being useless, some making it motivating for coding.
* [ ] Friends system
* [ ] Poking (Shows a visual in Status bar)
* [ ] Integration with GitHub
* [ ] Groups (Invite users or go solo and track multiple projects into one)
* [ ] Badges
* [ ] Achivements
* [ ] Quackagotchi (a tomagatchi that gets fed with hours)
* [ ] Weekly notifications via E-mail or Discord

# Setup
Rename [.env.example](.env.example) to .env and configure values.
Install the [Deno](https://deno.com/) runtime. Then, run:
```sh
deno run prod
```
The server will be active on `http://localhost:3000`!

# AI Usage
Any commits begining with `(AI)` or `[AI]` means that majority of the code was made with AI.  
AI was used to help with Heartbeat and Statistics services, filters for dashboard & tab completes. 

# License
[LICENSE](LICENSE)
