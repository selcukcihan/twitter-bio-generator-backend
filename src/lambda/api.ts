import 'source-map-support/register'
import 'reflect-metadata'
import { Container } from 'typedi'
import { S3Client } from '@aws-sdk/client-s3'
import { TwitterApi } from 'twitter-api-v2'
import { BioGenerator } from '../business/bio-generator'
import { Tokens } from '../business/tokens'
import { Configuration, OpenAIApi } from 'openai'


Container.set('S3_CLIENT', new S3Client({ region: 'eu-west-1' }))
Container.set('S3_BUCKET', process.env.BUCKET)

async function handler(event: any, context: any) {
  console.log(`Started processing...\nPayload: ${JSON.stringify({ event, context }, null, 2)}`)
  const twitterUserId = (event.requestContext.authorizer.jwt.claims.sub as string).split('|')[1]

  const tokens = await new Tokens().get(event.requestContext.authorizer.jwt.claims.sub)

  Container.set('TWITTER_API', new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY as string,
    appSecret: process.env.TWITTER_CONSUMER_SECRET as string,
    ...tokens,
  }))
  Container.set('OPEN_AI_CLIENT', new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY as string,
  })))

  const bioGenerator = Container.get(BioGenerator)
  const response = await bioGenerator.generate(twitterUserId)

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  }
}

export { handler }
