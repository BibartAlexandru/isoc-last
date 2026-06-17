import { useState } from "react";

import { Link } from "react-router-dom";

export default function Projects() {
  const [search, setSearch] = useState("");

  const projects = [
    {
      id: 1,
      name: "Website",
    },

    {
      id: 2,
      name: "Mobile App",
    },
  ];

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1>Projects</h1>

      <input
        placeholder="Search projects"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((project) => (
        <div key={project.id}>
          <Link to={`/projects/${project.id}`}>{project.name}</Link>
        </div>
      ))}
    </div>
  );
}
