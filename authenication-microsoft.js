const axios = require('axios');
const readline = require('readline');
const fs = require('fs'); // Add this line

// Microsoft public OAuth app (no secret needed)
const CLIENT_ID = '00000000402b5328';
const REDIRECT_URI = 'https://login.live.com/oauth20_desktop.srf';
const SCOPE = 'XboxLive.signin offline_access';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  // Step 1: Open browser for Microsoft login
  const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;

  console.log(`\n🔗 Open this URL in your browser and log in:`);
  console.log(authUrl);

  rl.question('\n📥 After login, paste the code from the URL here: ', async (code) => {
    try {
      // Step 2: Exchange code for Microsoft OAuth token
      const tokenRes = await axios.post('https://login.live.com/oauth20_token.srf', new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const oauth = tokenRes.data.access_token;
      const refreshToken = tokenRes.data.refresh_token;
      const expiry = new Date(Date.now() + tokenRes.data.expires_in * 1000);

      // Step 3: Get Xbox Live (XBL) token
      const xblRes = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${oauth}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const xbl = xblRes.data.Token;
      const userHash = xblRes.data.DisplayClaims.xui[0].uhs;

      // Step 4: Get XSTS token
      const xstsRes = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xbl],
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const xsts = xstsRes.data.Token;

      // Step 5: Get Minecraft access token
      const mcRes = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        identityToken: `XBL3.0 x=${userHash};${xsts}`
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const session = mcRes.data.access_token;

      // Final result
      const result = {
        oauth,
        refreshToken,
        expiry,
        xbl,
        xsts,
        userHash,
        session
      };

      // Write result to account.json
      fs.writeFileSync('./account.json', JSON.stringify(result, null, 2));

      console.log('\n✅ Authentication complete. Tokens saved to ./account.json');

    } catch (err) {
      console.error('\n❌ Error during authentication:', err.response?.data || err.message);
    } finally {
      rl.close();
    }
  });
})();
