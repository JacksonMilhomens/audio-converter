const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

async function downloadFile(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function convertAudio(inputPath, outputPath, format) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat(format)
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

app.post('/convert-audio', async (req, res) => {
    const { url, format } = req.body;
    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required.' });
    }

    const downloadPath = path.resolve(__dirname, `${crypto.randomUUID()}.ogg`);
    const outputPath = path.resolve(__dirname, `${crypto.randomUUID()}.${format}`);

    try {
        console.log('Baixando arquivo...');
        await downloadFile(url, downloadPath);
        console.log('Arquivo baixado com sucesso.');

        console.log('Convertendo arquivo...');
        await convertAudio(downloadPath, outputPath, format);
        console.log('Arquivo convertido com sucesso.');

        // Remover o arquivo OGG original se não for mais necessário
        fs.unlinkSync(downloadPath);

        // res.download(outputPath, (err) => {
        //     if (err) {
        //         console.error('Erro ao enviar o arquivo:', err);
        //         res.status(500).json({ error: 'Erro ao enviar o arquivo.' });
        //     }

        //     // Remover o arquivo convertido após o envio
        //     fs.unlinkSync(outputPath);
        // });

        const openai = new OpenAI();

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(outputPath),
            model: "whisper-1",
        });

        return res.json({ transcription: transcription.text });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: 'Erro ao processar o áudio.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
