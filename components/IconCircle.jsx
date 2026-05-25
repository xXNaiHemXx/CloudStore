import Icon from "./Icon";

export default function IconCircle({ name, size = "1rem", color = "#ffffff", bgColor = "#6366f1" }) {
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: bgColor,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={size} color={color} />
    </div>
  );
}