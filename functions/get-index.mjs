import fs from 'fs'
import Mustache from 'mustache'
import { AwsClient } from 'aws4fetch'
import { fromNodeProviderChain } from "@aws-sdk/credential-providers"

/**
 * Notice that the variable html is declared and assigned OUTSIDE the handler function. The declaration and assignment code will run ONLY the first time our code executes in a new worker instance (an instance of a micro VM running this Lambda function).
 * The same goes for any variables you declare outside the handler function, such as the fs module which we required at the top.
 * This helps improve performance and allows us to load and cache static data only on the first invocation, which helps improve performance on subsequent invocations.
*/
// const html = fs.readFileSync('static/index.html', 'utf-8')

const restaurantsApiRoot = process.env.restaurants_api
const cognitoUserPoolId = process.env.cognito_user_pool_id
const cognitoClientId = process.env.cognito_client_id
const awsRegion = process.env.AWS_REGION
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const credentialProvider = fromNodeProviderChain()
const credentials = await credentialProvider()
const aws = new AwsClient({
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey,
  sessionToken: credentials.sessionToken
})

const template = fs.readFileSync('static/index.html', 'utf-8')

const getRestaurants = async () => {
  const resp = await aws.fetch(restaurantsApiRoot)
  if (!resp.ok) {
    throw new Error('Failed to fetch restaurants: ' + resp.statusText)
  }
  return await resp.json()
}

export const handler = async (event, context) => {
  const restaurants = await getRestaurants()
  console.log(`found ${restaurants.length} restaurants`)  
  const dayOfWeek = days[new Date().getDay()]
  const view = {
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    dayOfWeek,
    restaurants,
    searchUrl: `${restaurantsApiRoot}/search`
  }
  const html = Mustache.render(template, view)
  const response = {
    statusCode: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8'
    },
    body: html
  }

  return response
}