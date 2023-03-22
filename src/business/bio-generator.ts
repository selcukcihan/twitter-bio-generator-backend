import { Inject, Service } from 'typedi'
import { Twitter } from './twitter'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { OpenAIApi } from 'openai'

@Service()
export class BioGenerator {
  constructor(
    private readonly twitter: Twitter,
    @Inject('S3_CLIENT') private readonly s3Client: S3Client,
    @Inject('S3_BUCKET') private readonly s3Bucket: string,
    @Inject('OPEN_AI_CLIENT') private readonly openai: OpenAIApi,
  ) {}

  async generate(twitterUserId: string) {
    const bio = await this.twitter.bio()
    let systemContent = [
      'Sen insanların kendilerini tanıttıkları yazılara bakarak,',
      'eğlenceli ve komik yeni yazılar türeten bir yardımcısın.',
    ].join(' ')
    const content = [
      'Birazdan yazacağım tanıtım yazısına bakarak, uzunluğu 160 karakteri geçmeyen eğlenceli ve komik yeni bir tanıtım yazısı türet.',
      `Başla: '${bio}'.`,
    ].join(' ')
    const input = {
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: systemContent},
        {role: "user", content}
      ]
    } as any
    console.log(JSON.stringify(input, null, 2))

    const response = await this.openai.createChatCompletion(input)
    const generated = response.data.choices[0].message?.content || ''

    console.log('Generated response: ' + generated)
    
    await this.s3Client.send(new PutObjectCommand({
      Body: JSON.stringify({
        original: bio,
        generated,
      }),
      Key: `user/${twitterUserId}/bio.json`,
      Bucket: this.s3Bucket,
      ACL: 'public-read',
    }))
    return {
      bio,
      generated,
    }
  }
}
