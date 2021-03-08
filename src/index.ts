import express, { Application, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const port: string | number = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({
    message: 'Thịnh Ngọc'
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
