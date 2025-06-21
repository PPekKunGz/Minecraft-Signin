# 🎮 Minecraft Xbox Live Authenticator (Manual OAuth Flow)

This Node.js script performs a complete authentication process from **Microsoft OAuth** to **Minecraft access token** using the official flow:
Microsoft → Xbox Live → XSTS → Minecraft.

---

## 🚀 Features

- 🔐 Manual Microsoft OAuth 2.0 login (via browser)
- 🎮 Xbox Live (XBL) token acquisition
- 🛡️ Xbox Secure Token Service (XSTS) authentication
- 🧱 Minecraft session token retrieval
- 💾 Saves all tokens to `account.json` for later use

---

## 📦 Requirements

- Node.js 14+
- Internet connection
- A web browser to log into Microsoft

---

## 🛠️ How to Use

### 1. Download or Clone the Repository

```bash
git clone https://github.com/PPekKunGz/xbox-minecraft-auth.git
cd xbox-minecraft-auth
```
### 2. Install Dependencies
```bash
npm install axios
```
- readline and fs are built-in Node.js modules and do not require installation.

### 3. Run the Script
```bash
node get-token.js or authenication-microsoft.js
```

### 4. Follow the Terminal Prompts
- You'll see a login URL like this:
```bash
🔗 Open this URL in your browser and log in:
https://login.live.com/oauth20_authorize.srf?client_id=...
```
- After logging in, you'll be redirected to a page with a URL like:
```bash
https://login.live.com/oauth20_desktop.srf?code=M.C516_BAY.2.U.712aqa3d-7661-89e2-2520-18114791s268&lc=1033
```
- Copy the code part and paste it into the terminal prompt:

```
📥 After login, paste the code from the URL here:
> M.C516_BAY.2.U.712aqa3d-7661-89e2-2520-18114791s268
```
- The script will continue and save your tokens to account.json.