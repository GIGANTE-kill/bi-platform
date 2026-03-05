import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
    try {
        const { html, fileName } = await req.json();

        if (!html) {
            return NextResponse.json({ error: 'HTML content missing' }, { status: 400 });
        }

        // Launch a headless browser instance
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // Use system chromium path (needed for Docker)
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // 1. Set the HTML content of the page
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load', 'domcontentloaded'], // ensure images and tailwind styles from CDN/local load
        });

        // 2. Add an explicit tiny pause for any lingering font or layout shifts
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A3',
            landscape: true,
            scale: 0.8, // Slightly increased scale for better readability
            printBackground: true, // IMPORTANT: Enable background colors/images
            margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
        });

        await browser.close();

        // Return the generated PDF to the client
        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName || 'relatorio'}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Error in Puppeteer PDF generation:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
