
import express from "express";
import bodyParser from "body-parser";
import { JsonDB, Config } from 'node-json-db';
import * as JWT from 'jwt-simple';
import { Article, User } from "./models";
import { getArticles } from "./data/articles";
import { getTags } from "./data/tags";
import { getUsers } from "./data/users";


const server = express();
const jsonParser = bodyParser.json();
server.use(jsonParser);

const secret = 'supernotsecret';
const db = new JsonDB(new Config("db.json", true, true, '/', true));


const getUerMdlwr = async (req, res, next) => {
	const auth = `${req.headers.authorization}`;
	if (!auth) {
		req.user = null;
		return next();
	}
	const token = auth.split(' ')[1];
	const tokenPayload = JWT.decode(token, secret);
	const { email } = tokenPayload;
	const users = await db.getObject<User[]>('/users') || [];
	const user = users.find(u => u.email === email);
	req.user = user;
	next();
};

//users for test 
server.get("/api/users", async (req, res) => {
	const users = await db.getData('/users');
	res.status(200).send(users);
});

server.post("/api/users", async (req, res) => {
	const creds = req.body;
	const users = await db.getObject<User[]>('/users') || [];
	const exist = users.find((u) => u.email === creds.email);
	if (!!exist) {
		return res.status(409).send();
	}
	await db.push('/users', [creds], false);
	const { password, ...userDetails } = creds;
	const token = JWT.encode({ email: creds.email }, secret);

	res.status(201).send({ user: { ...userDetails, token } });
});

//login
server.post("/api/users/login", async (req, res) => {
	const allUsers = await db.getObject<User[]>('/users') || [];
	const creds: any = req.body.user || {};
	const user = allUsers.find(
		(u) => u.email === creds.email && u.password === creds.password
	);


	if (!!user) {
		const { password, ...userDetails } = user;
		const tokenPayload = { email: user.email };
		const token = JWT.encode(tokenPayload, secret);
		return res
			.status(200)
			.send({ user: { ...userDetails, token } });
	}

	return res.status(401).send();
});

//tags
server.get("/api/tags", async (req, res) => {
	const tags = await db.getData('/tags');
	res.status(200).send({ tags: tags });
});

//articles

server.get("/api/articles", async (req, res) => {
	const articles = await db.getObject<Article[]>('/articles');
	const articlesCount = articles?.length || 0;

	res.status(200).send({ articles, articlesCount });
});

// articles -> like

server.post("/api/articles/:slug/favorite", getUerMdlwr, async (req: any, res) => {
	const slug = req.params.slug;
	const articles = await db.getObject<Article[]>('/articles');
	const users = await db.getObject<User[]>('/users');
	console.log(req.user);
	const requestedArticle = articles.find(article => article.slug === slug);
	if (!requestedArticle) {
		return res.status(404).send();
	}
	const user = users.find(u => u.email === req.user.email);
	user.favoritesSlugs.push(requestedArticle.slug);
	requestedArticle.favorited = true;
	requestedArticle.favoritesCount += 1;
	await db.push('/articles', articles, true);
	await db.push('/users', users, true);
	res.status(200).send({ requestedArticle });
});

//articles/feed

server.get("/api/articles/feed", async (req, res) => {
	const articles = await db.getObject<Article[]>('/articles');
	const articlesCount = articles?.length || 0;

	res.status(200).send({ articles, articlesCount });
});


server.listen(3000, () => {
	console.log(`Server listening on http://localhost:3000`);
});


const init = () => {
	db.push('/users', getUsers.users).then(async () => {
		const users = await db.getObject<User[]>('/users');
	});

	db.push('/articles', getArticles.articles).then(async () => {
		const articles = await db.getObject<Article[]>('/articles');
	});

	db.push('/tags', getTags.tags).then(async () => {
		const tags = await db.getObject<string[]>('/tags');
	});



};



init();