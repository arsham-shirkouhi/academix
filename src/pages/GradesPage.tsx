import GradeOverview from "../components/GradeOverview";

function GradesPage() {
    return (
        <div style={{
            padding: "15px",
            position: "relative",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            maxHeight: "100vh",
            boxSizing: "border-box"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "15px"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h2 style={{
                        fontSize: "42px",
                        fontWeight: "900",
                        color: "#1f0741",
                        margin: 0
                    }}>
                        Grades
                    </h2>
                </div>
            </div>
            <GradeOverview />
        </div>
    );
}

export default GradesPage; 