import { EtymologyTimeline } from "../EtymologyTimeline";

export default function EtymologyTimelineExample() {
  const mockSteps = [
    {
      language: "Greek",
      period: "Ancient",
      form: "ephēmeros",
      meaning: "lasting only a day",
    },
    {
      language: "Latin",
      period: "Classical",
      form: "ephemerus",
      meaning: "short-lived",
    },
    {
      language: "French",
      period: "16th century",
      form: "éphémère",
      meaning: "transitory",
    },
    {
      language: "English",
      period: "1600s",
      form: "ephemeral",
      meaning: "lasting for a very short time",
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <EtymologyTimeline
        etymology="From Greek ephēmeros 'lasting only a day', from epi 'upon' + hēmera 'day'."
        steps={mockSteps}
      />
    </div>
  );
}
