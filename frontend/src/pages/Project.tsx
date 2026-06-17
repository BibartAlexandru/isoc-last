import { useParams } from "react-router-dom";

export default function Project() {
  const { id } = useParams();

  const bugs = [
    {
      id: 1,
      name: "Login broken",
      status: "OPEN",
    },

    {
      id: 2,
      name: "Crash on submit",
      status: "FIXED",
    },
  ];

  return (
    <div>
      <h1>Project {id}</h1>

      <h2>Bugs</h2>

      {bugs.map((bug) => (
        <div key={bug.id}>
          <h3>{bug.name}</h3>

          <p>{bug.status}</p>
        </div>
      ))}
    </div>
  );
}
