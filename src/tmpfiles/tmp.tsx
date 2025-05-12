<div className="workplace d-flex" style={{ backgroundColor: "#b0cfcf", zIndex: 1 }}>
    <button
        onClick={() => handleExternalLinkClick()}
        className="external-link-button"
        title="Open external link"
    >
        <i className="fas fa-external-link-alt" aria-hidden="true"></i>
    </button>
    <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
        <Modelling {...props}
            visibleFocusDetails={visibleFocusDetails}
            setVisibleFocusDetails={setVisibleFocusDetails}
            exportTab={exportTab}
        />
        {/* <Modelling toggleRefresh={toggleRefresh} /> */}
    </div>
</div>