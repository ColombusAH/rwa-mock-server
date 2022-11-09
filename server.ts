import jsonServer from "json-server";
import { JsonDB, Config } from 'node-json-db';
import { getArticles } from "./data/articles";
import { getTags } from "./data/tags";
import { getUsers } from "./data/users";
import { Article, User } from "./models";

const middleware = jsonServer.defaults();
const server = jsonServer.create();
const db = new JsonDB(new Config("db.json", true, true, '/'));
server.use(middleware);
server.use(jsonServer.bodyParser);

//users
server.get("/api/users", async (req, res) => {
	const users = await db.getData('/users');
	res.status(200).send(users);
});

server.post("/api/users", async (req, res) => {
	const user = req.body;
	const users = await db.getData('/users') || [];
	const exist = users.find((u) => u.email === user.email);
	if (!!exist) {
		return res.status(409).send();
	}
	users.push(user);
	res.status(201).send({ user: { ...user, token: "faketoken" } });
});

//login
server.post("/api/users/login", async (req, res) => {
	console.log("[/api/users/login]");
	const allUsers = await db.getObject<User[]>('/users') || [];
	const creds: any = req.body.user || {};
	const user = allUsers.find(
		(u) => u.email === creds.email && u.password === creds.password
	);

	console.log(user);
	if (!!user) {
		const { password, ...userDetails } = user;
		return res
			.status(200)
			.send({ user: { ...userDetails, token: "faketoken" } });
	}
	return res.status(401).send();
});

//tags
server.get("/api/tags", async (req, res) => {
	console.log(await db.getData('/tags'));
	res.status(200).send(db.getData('/tags'));
});

//articles

server.get("/api/articles", async (req, res) => {
	console.log(await db.getObject<Article[]>('/articles'));
	const articles = await db.getObject<Article[]>('/articles');
	const articlesCount = articles?.length || 0;

	res.status(200).send({ articles, articlesCount });
});

//articles/feed

server.get("/api/articles/feed", async (req, res) => {
	console.log(await db.getObject<Article[]>('/articles'));
	const articles = await db.getObject<Article[]>('/articles');
	const articlesCount = articles?.length || 0;

	res.status(200).send({ articles, articlesCount });
});

server.listen(3000, () => {
	console.log(`Server listening on localhost:3000`);
});

const init = () => {
	db.push('/users', getUsers.users).then(async () => {
		console.log('users loaded');
		const users = await db.getObject<User[]>('/users');
		console.log(users);
	});

	db.push('/articles', getArticles.articles).then(async () => {
		console.log('articles loaded');
		const articles = await db.getObject<Article[]>('/articles');
		console.log(articles);
	});

	db.push('/tags', getTags.tags).then(async () => {
		console.log('tags loaded');
		const tags = await db.getObject<string[]>('/tags');
		console.log(tags);
	});



};


init();