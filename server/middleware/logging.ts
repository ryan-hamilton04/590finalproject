export default defineEventHandler((event) => {
  console.log(`${event.node.req.method} ${event.node.req.url}`);
});