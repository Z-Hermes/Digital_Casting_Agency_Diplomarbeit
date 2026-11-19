export async function load() {
  const posts = [
    {
      id: 1,
      title: "Casting Call: Lead Actor",
      author: "Studio Shkodra",
      likes: 1240,
      comments: 85
    },
    {
      id: 2,
      title: "Commercial Spot",
      author: "Media Production AL",
      likes: 850,
      comments: 42
    },
    {
      id: 3,
      title: "Behind the Scenes",
      author: "Director Vata",
      likes: 2150,
      comments: 130
    }
  ];

  return { posts };
}