import { db } from '$lib/server/database.js';
 
export async function GET() {

	const [rows] = await db.execute('SELECT 1 AS test');
 
	return new Response(

		JSON.stringify({

			success: true,

			database: rows

		}),

		{

			headers: {

				'Content-Type': 'application/json'

			}

		}

	);

}
 