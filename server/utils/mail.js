const { Resend } = require('resend');
const { getSupabase } = require('../db/supabase');
const localDb = require('../db/database');

/**
 * settings 테이블에서 값 읽기 (Supabase → localDb fallback)
 */
async function getSetting(key) {
    try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        if (!error && data && data.value) return data.value;
    } catch (e) { /* Supabase 미연결 시 localDb로 fallback */ }
    try {
        const row = await localDb.get('SELECT value FROM settings WHERE key = ?', [key]);
        if (row && row.value) return row.value;
    } catch (e) { /* 무시 */ }
    return '';
}

/**
 * 면접 완료 알림 이메일 발송 (Resend HTTP API 사용)
 */
async function sendInterviewNotification({ candidateName, candidateEmail, jobTitle, aiScore, recommendation }) {
    try {
        // 1. Resend API Key 읽기
        const resendApiKey = await getSetting('resend_api_key');
        if (!resendApiKey) {
            console.warn('[Mail] Resend API Key가 설정되지 않았습니다. 발송을 건너뜁니다.');
            return;
        }

        // 2. 발신자 이메일 읽기 (도메인 등록 전에는 onboarding@resend.dev 사용)
        const fromEmail = await getSetting('resend_from_email') || 'TecAce AI <onboarding@resend.dev>';

        // 3. 수신자 목록 읽기
        const recipientsRaw = await getSetting('notification_emails');
        let recipients = ['charliekim@tecace.com'];
        if (recipientsRaw) {
            try {
                const parsed = JSON.parse(recipientsRaw);
                if (Array.isArray(parsed) && parsed.length > 0) recipients = parsed;
            } catch (e) {
                console.error('[Mail] 수신자 목록 JSON 파싱 에러:', e.message);
            }
        }

        console.log(`[Mail] Resend API로 발송 시도 중... To: ${recipients.join(', ')}`);

        // 4. 이메일 내용 구성
        const scoreDisplay = aiScore !== undefined && aiScore !== null ? `${aiScore}점` : '분석 중';
        const recDisplay = recommendation || '—';

        const htmlBody = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <h1 style="color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 4px;">TecAce AI Interview</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">면접 완료 알림</p>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 20px;">아래 지원자의 AI 면접이 완료되었습니다.</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600; width: 120px;">지원자</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${candidateName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">이메일</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px;">${candidateEmail}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">지원 직무</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${jobTitle || '—'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">AI 점수</td>
                        <td style="padding: 12px 0;">
                            <span style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-size: 18px; font-weight: 900; padding: 4px 16px; border-radius: 8px;">${scoreDisplay}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #94a3b8; font-size: 13px; font-weight: 600;">추천 결과</td>
                        <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 700;">${recDisplay}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                TecAce AI Interview Platform · Admin 페이지에서 상세 결과를 확인하세요.
            </p>
        </div>
        `;

        // 5. Resend API로 발송
        const resend = new Resend(resendApiKey);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: recipients,
            subject: `[TecAce] ${candidateName}님의 면접이 완료되었습니다 — AI Score: ${scoreDisplay}`,
            html: htmlBody,
        });

        if (error) {
            console.error('[Mail] Resend 발송 실패:', error.message || JSON.stringify(error));
        } else {
            console.log(`[Mail] Resend 발송 성공! (id: ${data?.id})`);
        }
    } catch (e) {
        console.error('[Mail] 최종 에러 (면접 데이터는 보존됨):', e.message);
    }
}

/**
 * Resend API Key를 검증하고 테스트 메일을 발송합니다 (Admin UI용)
 */
async function verifyMailConfig(apiKey, toEmail) {
    if (!apiKey) throw new Error('Resend API Key를 입력해주세요.');

    console.log(`[Mail] Resend API Key 검증 및 테스트 메일 발송 중... to: ${toEmail || '(기본값)'}`);
    const resend = new Resend(apiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'TecAce System <onboarding@resend.dev>',
            to: [toEmail || 'charliekim@tecace.com'],
            subject: '[TecAce] 이메일 발송 설정 테스트 완료 (Resend)',
            text: `이 메일이 도착했다면 AI 인터뷰 완료 알림 설정이 정상적으로 완료된 것입니다.\n\n발송 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)\n서비스: Resend HTTP API`
        });

        if (error) {
            console.error('[Mail] Resend 테스트 실패:', JSON.stringify(error));
            const errMsg = error.message || error.name || JSON.stringify(error);
            const err = new Error(errMsg);
            err.statusCode = error.statusCode;
            err.resendName = error.name;
            throw err;
        }

        console.log(`[Mail] 테스트 메일 발송 완료! (id: ${data?.id})`);
        return { success: true, id: data?.id };
    } catch (e) {
        console.error('[Mail] Resend 검증 실패:', e.message, e.statusCode || '');
        throw e;
    }
}

module.exports = { sendInterviewNotification, verifyMailConfig };
