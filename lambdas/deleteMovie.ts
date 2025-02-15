import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    // Print Event
    console.log("[EVENT]", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    if (!movieId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Movie ID is required" })
        };
    }

    try {
        const result = await docClient.send(new DeleteCommand({
            TableName: process.env.TABLE_NAME,
            Key: { id: movieId } // 确保这里的 Key 结构与你的 DynamoDB 表结构匹配
        }));

        return {
            statusCode: 200, // 更改为200 OK以包含消息体
            body: JSON.stringify({ message: "Movie deleted successfully" }) // 包含成功消
        };
    } catch (error) {
        console.error("Delete error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to delete movie" })
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
