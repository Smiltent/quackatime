<h1 align="center">Quackatime</h1>
<p align="center"><em>a WakaTime-compatible backend for coding statistics that Quacks</em></p>

# About
An alternative to WakaTime, which you can self-host!  
Hugely insprired by WakaTime and [Hackatime](https://github.com/hackclub/hackatime) (helped me figure out the API endpoints).

# Features
* [ ] Friends
* [ ] Poking (Shows a visual in Status bar)
* [ ] Integration with GitHub
* [ ] Authentication via SSO
* [ ] Groups (Invite users or go solo and track multiple projects into one)
* [ ] Badges
* [ ] Leaderboards (Daily, Weekly, Friends, Total)
* [ ] Achivements (Unsure for v1)
* [ ] Virtual Duck Shop (Unsure for v1)
* [ ] Weekly notifications via E-mail or Discord

# Setup
Rename [.env.example](.env.example) to .env, configure values.

Install the [Bun](https://bun.sh/) runtime. Then, run:
```sh
bun run prod
```
The server will be active on `http://localhost:3000`!

# License
[LICENSE](LICENSE)
