from motor.motor_asyncio import AsyncIOMotorClient
import os

class Database:
    client: AsyncIOMotorClient = None
    
db_instance = Database()

async def get_database():
    return db_instance.client[os.environ['DB_NAME']]

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    
async def close_mongo_connection():
    db_instance.client.close()
