import { Service, Inject } from 'typedi'
import axiosRetry from 'axios-retry'
import axios from 'axios'
import { TwitterApi } from 'twitter-api-v2'

axiosRetry(axios, { retries: 3 })

@Service()
export class Twitter {
  constructor(
    @Inject('TWITTER_API') private readonly twitterApi: TwitterApi,
  ) {}

  async bio(): Promise<string> {
    const user = await this.twitterApi.currentUserV2()
    return user.data?.description || ''
  }
}
