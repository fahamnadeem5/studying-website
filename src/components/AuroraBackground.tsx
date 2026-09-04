/**
 * AuroraBackground — fixed, behind-everything animated gradient layer.
 * Renders three large radial gradients that drift slowly across the viewport
 * for a subtle "aurora" effect. Pure CSS, no JS, no paint churn.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden>
      <div className="aurora-3" />
    </div>
  );
}
