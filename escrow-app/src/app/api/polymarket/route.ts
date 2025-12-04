import { NextRequest, NextResponse } from 'next/server';

const GAMMA_API = 'https://gamma-api.polymarket.com';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const conditionId = searchParams.get('conditionId');

    try {
        let url = `${GAMMA_API}/markets?closed=false&limit=20`;

        if (conditionId) {
            url = `${GAMMA_API}/markets?conditionId=${conditionId}`;
        } else if (query) {
            url = `${GAMMA_API}/markets?closed=false&limit=20&_q=${encodeURIComponent(query)}`;
        }

        console.log('Server: Fetching from Gamma API:', url);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Server: Gamma API failed with status:', response.status);
            return NextResponse.json(
                { error: 'Failed to fetch markets', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Server: Successfully fetched', Array.isArray(data) ? data.length : 0, 'markets');

        return NextResponse.json(data);
    } catch (error) {
        console.error('Server: Polymarket API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}