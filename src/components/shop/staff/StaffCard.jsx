// create a staff card component
import "./StaffCard.css";
const StaffCard = ({ staff }) => {
    return (
        <div className="staff-card">
            <div className="staff-info">
                <h3>{staff.name}</h3>
                <p>Email: {staff.email}</p>
                <p>Phone: {staff.phone}</p>
                <p>Role: {staff.role}</p>
            </div>
            <div className="staff-actions">
                {/* Add action buttons here if needed */}
            </div>
        </div>
    );
}
export default StaffCard;