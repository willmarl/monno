const envMode = process.env.NODE_ENV;

export default function page() {
  return <div>{envMode}</div>;
}
