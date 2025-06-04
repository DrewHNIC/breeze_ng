import React, { useState } from "react";

interface AccordionItemProps {
  question: string;
  answer: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-black"> {/* Darker border for contrast */}
      <button
        className="flex justify-between items-center w-full py-4 px-6 text-left bg-black text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="py-4 px-6 bg-black text-white">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

const Accordion: React.FC<AccordionProps> = ({ items }) => {
  return (
    <div className="border-t border-black bg-black text-white">
      {items.map((item) => (
        <AccordionItem key={item.id} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
};

export default Accordion;
