import express, { Application, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

dotenv.config();

const app: Application = express();
const port: string | number = process.env.PORT || 8080;

mongoose.connect(`${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
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

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({
    message: 'Thịnh Ngọc'
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
