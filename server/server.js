import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
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
        const sourceLanguage = req.body.sourceLanguage;
        const targetLanguage = req.body.targetLanguage;
        const difficultyOption = req.body.difficultyOption;

        let premable;
        if (targetLanguage === 'french') {
            if (difficultyOption === 'beginner') {
                premable = 'Supposons que je sois un enfant.';
            } else if (difficultyOption === 'intermediate') {
                premable = 'Supposons que je sois un adolescent.';
            } else if (difficultyOption === 'advanced') {
                premable = 'Supposons que je sois un adulte.';
            } else {
                throw new Error(`Unrecognized difficulty option: ${difficultyOption}`);
            }
        } else if (targetLanguage === 'spanish') {
            if (difficultyOption === 'beginner') {
                premable = 'Supongamos que soy un niño.';
            } else if (difficultyOption === 'intermediate') {
                premable = 'Supongamos que soy un adolescente.';
            } else if (difficultyOption === 'advanced') {
                premable = 'Supongamos que soy un adulto.';
            } else {
                throw new Error(`Unrecognized difficulty option: ${difficultyOption}`);
            }
        } else {
            throw new Error(`Unrecognized target language: ${targetLanguage}`);
        }

        const finalPrompt = `${premable}\n\n${prompt}`;

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `${finalPrompt}\n\n`,
            temperature: 0.2,
            max_tokens: MAX_TOKENS,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        const responseText = response.data.choices[0].text;

        const responseSourceTranslation = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Translate this to ${sourceLanguage}:\n\n${responseText}\n\n`,
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