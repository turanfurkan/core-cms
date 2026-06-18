import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { backendFetch } from '@/lib/api-server';
import { getClientIP } from '@/lib/api';
import { deleteFromS3, uploadToS3 } from '@/lib/s3-upload';
import { systemLog } from '@/services/system-log';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const group = searchParams.get('group') || '';

    const params = new URLSearchParams();
    if (group) {
      params.append('group', group);
    }

    const response = await backendFetch(`/api/admin/settings?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to fetch settings.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const clientIp = getClientIP(req);

    // Fetch existing settings to retrieve current logo URL
    const existingRes = await backendFetch('/api/admin/settings');
    const existingJson = await existingRes.json();
    const existingList = existingJson.data || [];
    const logoSetting = existingList.find((item) => item.key === 'site.logo');
    let logoUrl = logoSetting ? logoSetting.value : null;

    // Parse incoming FormData
    const formData = await req.formData();

    const logoAction = formData.get('logoAction');
    const logoFile = formData.get('logoFile');

    // Handle logo deletion
    if (logoAction === 'remove' && logoUrl) {
      try {
        await deleteFromS3(logoUrl);
        logoUrl = null;
      } catch (error) {
        console.error('Failed to remove logo from S3:', error);
      }
    }

    // Handle new logo upload
    if (
      logoAction === 'save' &&
      logoFile &&
      logoFile instanceof File &&
      logoFile.size > 0
    ) {
      try {
        const fileCompatible = new File(
          [await logoFile.arrayBuffer()],
          logoFile.name,
          { type: logoFile.type }
        );
        logoUrl = await uploadToS3(fileCompatible, 'misc');
      } catch (error) {
        console.error('Failed to upload logo to S3:', error);
        return NextResponse.json(
          { message: 'Failed to upload logo to storage.' },
          { status: 500 }
        );
      }
    }

    // Extract other parameters from Form Data
    const nameTr = formData.get('name_tr') || '';
    const nameEn = formData.get('name_en') || '';
    const descTr = formData.get('desc_tr') || '';
    const descEn = formData.get('desc_en') || '';
    const phone = formData.get('contact_phone') || '';
    const email = formData.get('contact_email') || '';
    const facebook = formData.get('social_facebook') || '';
    const twitter = formData.get('social_twitter') || '';
    const instagram = formData.get('social_instagram') || '';
    const maintenanceMode = formData.get('maintenance_mode') === 'true';
    const mailHost = formData.get('mail_host') || '';
    const mailPort = formData.get('mail_port') ? parseInt(formData.get('mail_port'), 10) : null;
    const mailUsername = formData.get('mail_username') || '';
    const mailPassword = formData.get('mail_password') || '';

    // Prepare settings dictionary for backend
    const settingsPayload = {
      settings: {
        'site.name': {
          tr: nameTr,
          en: nameEn,
        },
        'site.description': {
          tr: descTr,
          en: descEn,
        },
        'site.logo': logoUrl,
        'site.contact_phone': phone,
        'site.contact_email': email,
        'site.social_links': {
          facebook,
          twitter,
          instagram,
        },
        'site.maintenance_mode': maintenanceMode,
        'mail.host': mailHost,
        'mail.port': mailPort,
        'mail.username': mailUsername,
        'mail.password': mailPassword,
      },
    };

    // Send PUT request to Laravel backend
    const response = await backendFetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to update settings.' },
        { status: response.status }
      );
    }

    // System event log
    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: session.user.id,
      entityType: 'system.settings',
      description: 'System and company settings updated.',
      ipAddress: clientIp,
    });

    return NextResponse.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong.' },
      { status: 500 }
    );
  }
}
