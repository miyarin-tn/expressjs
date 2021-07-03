import express, { Application, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import Backend from 'i18next-fs-backend';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config();

const options = {
  // order and from where user language should be detected
  order: [/*'path', 'session', */ 'querystring', 'header'],

  // keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupHeader: 'accept-language',
  lookupHeaderRegex: /(([a-z]{2})-?([A-Z]{2})?)\s*;?\s*(q=([0-9.]+))?/gi,
  lookupSession: 'lng',
  lookupPath: 'lng',
  lookupFromPathIndex: 0,

  // cache user language
  caches: false, // ['cookie']

  ignoreCase: true, // ignore case of detected language
};
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    // debug: true,
    backend: {
      // eslint-disable-next-line no-path-concat
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      // eslint-disable-next-line no-path-concat
      addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    fallbackLng: ['en', 'vi'],
    preload: ['en', 'vi'],
    saveMissing: true,
    detection: options
  })

const app: Application = express();
const port: string | number = process.env.PORT || 8080;

app.use(i18nextMiddleware.handle(i18next));

mongoose.connect(`${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).catch(err => {
  console.log(err);
})

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

/* const allowlist = ['http://localhost:4200', 'http://localhost:3000'];
const corsOptionsDelegate = (req: Request, callback: any) => {
  let corsOptions;
  if (allowlist.includes(req.header('Origin') || '')) {
    corsOptions = { origin: true }; // enable CORS
  } else {
    corsOptions = { origin: false }; // disable CORS
  }
  // const otherOptions = {
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: [
  //     'Origin',
  //     'X-Requested-With',
  //     'Content-Type',
  //     'Accept',
  //     'X-Access-Token',
  //   ],
  //   credentials: true,
  //   preflightContinue: true,
  //   optionsSuccessStatus: 200
  // };
  // corsOptions = { ...corsOptions, ...otherOptions };
  callback(null, corsOptions);
}
app.use(cors(corsOptionsDelegate)); */
app.use(cors());

// routes
const userRoute = require('./routes/user.route');
const authRoute = require('./routes/auth.route');

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({
    message: 'Thịnh Ngọc'
  });
});

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.get('/locales/:lng_id', (req: Request, res: Response, next: NextFunction) => {
  if (!i18next.languages.includes(req.params.lng_id)) {
    return res.status(404).json({ message: req.t('TRANSLATE.LANGUAGE_NOT_FOUND') });
  }
  try {
    let rawData = fs.readFileSync(path.resolve(__dirname, `locales/${req.params.lng_id}/translation.json`));
    let translate = JSON.parse(rawData.toString());
    return res.send(translate);
  } catch (err) {
    return res.status(404).json({ message: req.t('TRANSLATE.LANGUAGE_NOT_FOUND') });
  }
});
app.get('/apple-app-site-association', (req: Request, res: Response, next: NextFunction) => {
  // res.set('Content-Type', 'application/pkcs7-mime');
  // res.sendFile(path.join(__dirname, '/apple-app-site-association'));
  res.send({
    "applinks": {
      "apps": [],
      "details": [
        {
          "appID": "T24TNTNTNT.tn.yuudachi.yuu",
          "paths": ["*"]
        }
      ]
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
