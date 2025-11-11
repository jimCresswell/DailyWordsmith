import { ExampleSentences } from "../ExampleSentences";

export default function ExampleSentencesExample() {
  const mockExamples = [
    {
      sentence: "The ephemeral beauty of cherry blossoms reminds us to appreciate the present moment.",
      context: "Literary",
    },
    {
      sentence: "In the digital age, social media posts are ephemeral, quickly forgotten in the endless scroll.",
      context: "Contemporary",
    },
    {
      sentence: "The artist captured the ephemeral quality of light on water in her paintings.",
      context: "Art Criticism",
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ExampleSentences word="ephemeral" examples={mockExamples} />
    </div>
  );
}
