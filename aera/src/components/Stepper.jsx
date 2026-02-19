import './Stepper.css';

const Stepper = ({ steps, currentStep }) => (
  <ol className="stepper">
    {steps.map((step, index) => {
      const position = index + 1;
      const isActive = position === currentStep;
      const isDone = position < currentStep;

      return (
        <li key={step} className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
          <span className="step-index">{position}</span>
          <span className="step-label">{step}</span>
        </li>
      );
    })}
  </ol>
);

export default Stepper;
