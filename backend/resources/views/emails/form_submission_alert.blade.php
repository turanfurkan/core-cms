<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Yeni Form Gönderimi</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
            color: #1f2937;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #c7d2fe;
        }
        .content {
            padding: 30px;
        }
        .meta-box {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            border: 1px solid #f3f4f6;
            font-size: 13px;
            color: #6b7280;
        }
        .meta-box table {
            width: 100%;
        }
        .meta-box td {
            padding: 3px 0;
        }
        .meta-label {
            font-weight: 600;
            color: #4b5563;
            width: 120px;
        }
        .fields-table {
            width: 100%;
            border-collapse: collapse;
        }
        .fields-table th {
            text-align: left;
            padding: 12px;
            background-color: #f3f4f6;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e5e7eb;
        }
        .fields-table td {
            padding: 16px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            line-height: 1.5;
            vertical-align: top;
        }
        .label-cell {
            font-weight: 600;
            color: #374151;
            width: 35%;
        }
        .value-cell {
            color: #4b5563;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
        }
        a {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>Yeni Form Gönderimi</h1>
        <p>{{ $formTitle }}</p>
    </div>
    
    <div class="content">
        <div class="meta-box">
            <table>
                <tr>
                    <td class="meta-label">Gönderim Tarihi:</td>
                    <td>{{ $submittedAt }}</td>
                </tr>
                <tr>
                    <td class="meta-label">IP Adresi:</td>
                    <td>{{ $ipAddress }}</td>
                </tr>
            </table>
        </div>
        
        <table class="fields-table">
            <thead>
                <tr>
                    <th colspan="2">Gönderilen Bilgiler</th>
                </tr>
            </thead>
            <tbody>
                @foreach($fields as $field)
                    <tr>
                        <td class="label-cell">{{ $field['label'] }}</td>
                        <td class="value-cell">{!! $field['value'] !!}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        Bu e-posta, Core-CMS Form Builder sistemi tarafından otomatik olarak gönderilmiştir.
    </div>
</div>

</body>
</html>
