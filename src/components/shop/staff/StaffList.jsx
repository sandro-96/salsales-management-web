// create a staff list component
import StaffCard from "./StaffCard";
import "./StaffList.css";
const StaffList = ({ staffs }) => {
    return (
        <div className="staff-list">
            {staffs.length > 0 ? (
                staffs.map((staff) => (
                    <StaffCard key={staff.id} staff={staff} />
                ))
            ) : (
                <p className="no-staff">Không có nhân viên nào.</p>
            )}
        </div>
    );
}
export default StaffList;