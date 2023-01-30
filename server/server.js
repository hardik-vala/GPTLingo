import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const MAX_TOKENS = 500;

const configuration = new Configuration({
    organization: process.env.OPENAI_API_ORG,
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Server is running.',
    })
});

app.post('/', async (req, res) => {
    try {
        console.log({ req });

        const prompt = req.body.prompt;

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${prompt}\n\n`,
            temperature: 0.2,
            max_tokens: MAX_TOKENS,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const responseText = response.data.choices[0].text;

        const responseSourceTranslation = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Translate this to English:\n\n${responseText}\n\n`,
            temperature: 0,
            max_tokens: MAX_TOKENS,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const responseSourceTranslationText = responseSourceTranslation.data.choices[0].text;

        res.status(200).send({
            bot: responseText,
            botSourceTranslation: responseSourceTranslationText
        });

        // for testing
        // res.status(200).send({
        //     bot: "Como estas?",
        //     botSourceTranslation: "How are you?"
        // });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error });
    }
});

app.listen(5001, () => { console.log('Server is running on port http://localhost:5001')});