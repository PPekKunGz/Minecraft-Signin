const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const CLIENT_ID = '00000000402b5328';
const REDIRECT_URI = 'https://login.live.com/oauth20_desktop.srf';
const SCOPE = 'XboxLive.signin offline_access';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;

  console.log(`\n🔗 Open this URL in your browser and log in:`);
  console.log(authUrl);

  rl.question('\n📥 After login, paste the code from the URL here: ', async (code) => {
    try {
      // Step 2: Get Microsoft OAuth token
      const tokenRes = await axios.post('https://login.live.com/oauth20_token.srf', new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const oauthToken = tokenRes.data.access_token;
      const refreshToken = tokenRes.data.refresh_token;
      const oauthExpiry = Math.floor(Date.now() / 1000) + tokenRes.data.expires_in;

      // Step 3: Get Xbox Live (XBL) token
      const xblRes = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${oauthToken}`
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const xblToken = xblRes.data.Token;
      const userHash = xblRes.data.DisplayClaims.xui[0].uhs;
      const xblExpiry = Math.floor(Date.now() / 1000) + 7200;

      // Step 4: Get XSTS token
      const xstsRes = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xblToken]
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const xstsToken = xstsRes.data.Token;
      const xstsExpiry = Math.floor(Date.now() / 1000) + 7200;

      // Step 5: Get Minecraft access token
      const mcRes = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        identityToken: `XBL3.0 x=${userHash};${xstsToken}`
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const sessionToken = mcRes.data.access_token;
      const sessionExpiry = Math.floor(Date.now() / 1000) + 7200;

      // Final formatted output
      const result = {
        version: 1,
        alt: {
          oauth: {
            refreshToken,
            token: oauthToken,
            expiry: oauthExpiry
          },
          xbl: {
            userHash,
            token: xblToken,
            expiry: xblExpiry
          },
          xsts: {
            userHash,
            token: xstsToken,
            expiry: xstsExpiry
          },
          session: {
            token: sessionToken,
            expiry: sessionExpiry
          }
        }
      };

      fs.writeFileSync('./account.json', JSON.stringify(result, null, 2));
      console.log('\n✅ Authentication complete. Tokens saved to ./account.json');

    } catch (err) {
      console.error('\n❌ Error during authentication:', err.response?.data || err.message);
    } finally {
      rl.close();
    }
  });
})();
