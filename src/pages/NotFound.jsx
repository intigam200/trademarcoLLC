import { useEffect } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { Section } from "../components/Section";
import { setNoIndexSEO } from "../lib/seo";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function NotFound() {
  useEffect(() => { setNoIndexSEO("Page Not Found | TradeMarco Global"); }, []);

  return (
    <Section bg={COLORS.white}>
      <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.navy, margin: "0 0 12px" }}>Page Not Found</h1>
        <p style={{ fontSize: 15, color: COLORS.medGray, margin: "0 0 28px" }}>
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Try the homepage or browse our manufacturers.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Button as={Link} to="/" variant="primary">
            Back to Home <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
          <Button as={Link} to="/manufacturers" variant="outline">
            View Manufacturers
          </Button>
        </div>
      </div>
    </Section>
  );
}
