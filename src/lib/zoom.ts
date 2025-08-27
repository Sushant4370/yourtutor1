
import type { IBooking } from '@/models/Booking';
import type { IUser } from '@/models/User';

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

interface ZoomMeeting {
    join_url: string;
    start_url: string;
    id: string;
    start_time: string;
    topic: string;
    password?: string;
}

// Cache for the Zoom access token
let tokenCache = {
    token: '',
    expiresAt: 0,
};

/**
 * Gets a server-to-server OAuth token from Zoom.
 * Caches the token to avoid requesting a new one for every meeting.
 */
async function getZoomAccessToken(): Promise<string> {
    if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        throw new Error('Zoom environment variables are not configured.');
    }

    const authUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;
    
    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get Zoom access token: ${errorData.reason || response.statusText}`);
    }

    const data = await response.json();
    tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000, // Refresh 5 mins before expiry
    };
    
    return tokenCache.token;
}

/**
 * Creates a new Zoom meeting.
 * @param booking - The booking details.
 * @param tutor - The tutor's user object.
 * @returns The created Zoom meeting details.
 */
export async function createZoomMeeting(booking: IBooking, tutor: IUser): Promise<ZoomMeeting> {
    try {
        const accessToken = await getZoomAccessToken();
        
        // Convert the authoritative sessionDate from the database to an ISO string (UTC).
        const utcStartTime = new Date(booking.sessionDate).toISOString();

        const meetingDetails = {
            topic: `Tutoring Session: ${booking.subject}`,
            type: 2, // Scheduled meeting
            start_time: utcStartTime,
            duration: 60, // 1 hour
            timezone: 'UTC', // Explicitly tell Zoom to interpret start_time as UTC
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: false,
                watermark: false,
                use_pmi: false,
                approval_type: 0, // Automatically approve
                audio: 'both',
                auto_recording: 'none',
                waiting_room: true,
            },
        };

        const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(meetingDetails),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Zoom API error (${response.status}): ${errorData.message}`);
        }

        const data: ZoomMeeting = await response.json();
        console.log(`[Zoom Lib] Successfully created Zoom meeting ${data.id} for booking ${booking._id}`);
        return data;

    } catch (error) {
        console.error('[Zoom Lib] Error creating Zoom meeting:', error);
        throw error; // Re-throw to be handled by the caller
    }
}
