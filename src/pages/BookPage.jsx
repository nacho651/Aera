import { useSearchParams } from 'react-router-dom';
import BookingWidget from '../components/BookingWidget';
import './PageStyles.css';

const BookPage = () => {
  const [searchParams] = useSearchParams();
  const preferredAircraft = searchParams.get('aircraft') || '';
  const prefillFrom = searchParams.get('from') || '';
  const prefillTo = searchParams.get('to') || '';

  return (
    <section className="section">
      <div className="container">
        <div className="page-heading">
          <h1>Book Your Journey</h1>
          <p>
            Build your itinerary with realistic schedules, cabin options, and flexible passenger setup.
          </p>
        </div>

        <BookingWidget
          preferredAircraft={preferredAircraft}
          prefillFrom={prefillFrom}
          prefillTo={prefillTo}
        />
      </div>
    </section>
  );
};

export default BookPage;
