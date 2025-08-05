import { config } from 'dotenv'

export default function setup() {
  config()
  process.env.AWS_REGION = 'us-east-1'
}