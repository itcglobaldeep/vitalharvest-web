const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.post('/text', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a health and wellness assistant analyzing text for VitalHarvest."
                },
                {
                    role: "user",
                    content: content 
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: completion.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const cacheKey = `image_analysis:${Buffer.from(req.file.buffer).toString('base64').slice(0, 32)}`;
        
        const cachedResult = await cacheManager.get(cacheKey);
        if (cachedResult) {
            return res.json({
                data: {
                    content: cachedResult,
                    cached: true
                }
            });
        }

        const fileType = await fileTypeFromBuffer(req.file.buffer);
        if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        const processedImage = await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg')
            .toBuffer();

        const base64Image = processedImage.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a health and wellness assistant analyzing images for VitalHarvest."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What can you tell me about this image in terms of health and wellness?" },
                        { type: "image_url", url: imageUrl }
                    ]
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: response.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Image analysis failed' });
    }
});

module.exports = router;