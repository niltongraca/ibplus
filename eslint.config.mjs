import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".opencode/**"],
  },
  {
    // Regras introduzidas pelo eslint-plugin-react-hooks 7 (Next 16).
    // Exigem refatoração de estado em vários componentes; tratadas em trabalho separado.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
