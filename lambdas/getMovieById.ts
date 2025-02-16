import { APIGatewayProxyHandlerV2 } from "aws-lambda";


import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand ,QueryCommand} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
const docClient = DynamoDBDocumentClient.from(ddbDocClient);
// 定义响应的类型
interface MovieResponse {
  data: Record<string, any> | undefined;  // 允许 data 是 undefined
  cast?: Record<string, any>[];  // 演员信息，可选
}
async function getMovieDetails(movieId: number) {
    const commandOutput = await docClient.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: movieId },
    }));
    return commandOutput.Item;
}

async function getCastDetails(movieId: number) {
    const commandOutput = await docClient.send(new QueryCommand({
        TableName: process.env.CAST_TABLE_NAME,
        KeyConditionExpression: "movieId = :movieId",
        ExpressionAttributeValues: { ":movieId": movieId },
    }));
    return commandOutput.Items;
}

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    
    // Print Event
    console.log("[EVENT]", JSON.stringify(event));
    const movieId = event.pathParameters?.movieId ? parseInt(event.pathParameters.movieId) : undefined;
    const includeCast = event.queryStringParameters?.cast === 'true';

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }
    const movieDetails = await getMovieDetails(movieId);
    if (!movieDetails) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Movie not found" }),
      };
    }
    const response: MovieResponse = { data: movieDetails };
        if (includeCast) {
          const castDetails = await getCastDetails(movieId);
          if (castDetails) {
              response.cast = castDetails; // 使用 MovieResponse 接口中的可选 cast 属性
          }
        }

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
