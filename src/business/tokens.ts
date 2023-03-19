import { Service } from 'typedi'
import axiosRetry from 'axios-retry'
import axios from 'axios'

axiosRetry(axios, { retries: 3 })

@Service()
export class Tokens {
  async get(auth0Id: string) {
    /*
    auth0Id: mesela "twitter|134182720" bunu kullanarak bu kullanicinin Auth0'dan detayini cekecegiz
    Bu detaya ihtiyac duymamizin sebebi, icerisinde twitter API'lerini cagirmak icin kullanacagimiz
    bir "access token" ve "access token secret" olmasidir.
    continuation: twitter API'sinin pagination'u icin
    
    1. Auth0 admin API'sini cagirabilmek icin oncelikle bir token istiyoruz Auth0'dan.
    2. Bu token'i kullanarak, Auth0 admin API'sinden kullanicinin detayini cekiyoruz.
    3. Detaydaki token ve secret'i alarak, twitter API'sini bu kullanici adina cagiriyoruz.
    */
    const tokenResponse = await axios.post(process.env.AUTH0_TOKEN_URL as string, {
      client_id: process.env.AUTH0_ADMIN_CLIENT_ID,
      client_secret: process.env.AUTH0_ADMIN_CLIENT_SECRET,
      audience: process.env.AUTH0_ADMIN_AUDIENCE,
      grant_type: "client_credentials",
    }, {
      headers: { "content-type": "application/json" },
    })

    const userResponse = await axios.get(process.env.AUTH0_ADMIN_GET_USER_URL + auth0Id, {
      headers: {
        authorization: "Bearer " + tokenResponse.data.access_token,
      },
    })
    console.log(`AUTH0 tokens: ${JSON.stringify(userResponse.data, null, 2)}`)
    return {
      accessToken: userResponse.data.identities[0].access_token as string,
      accessSecret: userResponse.data.identities[0].access_token_secret as string,
    }
  }
}
