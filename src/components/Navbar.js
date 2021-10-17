// should  be refractor to react-bootstrap
import Link from 'next/link';
import { FaUser } from 'react-icons/fa';

const Navbar = (props) => (
	
	// <nav className="navbar sticky-top navbar-expand-sm navbar-dark bg-dark mb-1 width-90%">
	// <nav className="navbar sticky-top navbar-expand-md bg-white py-1">
	// navbar-expand{-sm|-md|-lg|-xl}
	<nav className="navbar navbar-expand-sm bg-white py-0">
		<div className="container mx-0 ">
			<a className="navbar-brand nabar-left mr-4" href="#">
				<img src="images/equinor-logo.svg" width="100" height="40" className="d-inline-block align-top" alt="Equinor logo"/>
				{/* <img src="https://www.equinor.com/etc.clientlibs/statoil/clientlibs/clientlib/resources/images/page/equinor-logo.png" width="100" height="40" className="d-inline-block align-top" alt="Equinor logo"/> */}
				{/* <img src="/static/spider-1.gif" width="40" height="40" alt="spider" /> */}
			</a>
			{/* <span ><strong>OrgEngine Teambuilder</strong> */}
			<span className="fs-3 text-warning" style={{ fontsize: "50%", minWidth: "26%", marginTop: "5px"}}>
				<Link href="/modelling"><a className="nav-link2"><strong> AKM Modeller</strong></a></Link>
			</span>
			<div className="collapse navbar-collapse " id="nav-toggler-metis">
				<ul className="navbar-nav ml-auto mr-3 ">
					<li className="nav-item">
						<Link href="/"><a className="nav-link active">Home</a></Link>
					</li>			
					<li className="nav-item color-white">
						<Link href="/modelling"><a className="nav-link">Modelling</a></Link>
					</li>
					{/* <li className="nav-item">
						<Link href="/table"><a className="nav-link">Tables</a></Link>
					</li> */}
					{/* <li className="nav-item dropdown">
						<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							More
            </a>
						<div className="dropdown-menu" aria-labelledby="navbarDropdown">
							<a className="dropdown-item" href="/login">Login</a>
							<a className="dropdown-item" href="/signup">Sign-up</a>
							<a className="dropdown-item" href="/people">Users</a>
							<a className="dropdown-item" href="/settings">Settings</a>
							<a className="dropdown-item" href="/akmm-graphql">JSON export</a>
							<a className="dropdown-item" href="/genGqlSchema">Gen Gql Schema</a>
							<a className="dropdown-item" href="/api/graphql" target="_blank" >GrapQL test</a>
							<div className="dropdown-divider"></div>
							<form className="form-inline my-2 my-lg-0">
								<input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
								<button className="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
							</form>
						</div>
					</li> */}
					<li className="nav-item dropdown bg-white" style={{borderRadius: "6px"}}>
						<a className="nav-link nav-login dropdown-toggle" id="navbarDropdownMenuLink-4" data-toggle="dropdown"
							aria-haspopup="true" aria-expanded="false">
							<FaUser style={{ paddingRigth: "1px", verticalAlign: "baseline" }} />
							<span className="username"> {props?.user?.name}</span> </a>
						<div className="dropdown-menu dropdown-menu-right dropdown-info" aria-labelledby="navbarDropdownMenuLink-4">
							<a className="dropdown-item" href="/login">Login</a>
							<a className="dropdown-item" href="/signup">Sign-up</a>
							<a className="dropdown-item" href="/settings">Settings</a>
						</div>
					</li>
					<li className="nav-item">
						<Link href="/videos"><a className="nav-link">Videos</a></Link>
					</li>
					<li className="nav-item">
						<Link href="/helpblog"><a className="nav-link">Help</a></Link>
					</li>
					<li className="nav-item">
						<Link href="/about"><a className="nav-link">About</a></Link>
					</li>
				</ul>
			</div>
			<div className='buttons' aria-expanded="false">
				<button className="navbar-toggler navbar-light"
					type="button"
					data-toggle="collapse"
					data-target="#nav-toggler-metis"
					aria-controls="nav-toggler-metis"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon float-right"></span>
				</button>
			</div>
			{/* <div><pre>{props}</pre></div> */}
		</div>
		<a className="navbar-brand ml-auto" href="http://www.kavca.no">
				<img src="images/Kavca-logo2.png" width="22" height="24" className="d-inline-block align-top m-1" alt="Kavca logo"/>
				<span className="fw-bold fs-4" style={{color: "#0083e2"}}>avca AS</span>
				{/* <img src="images/Equinor-logo.svg" width="100" height="40" className="d-inline-block align-top" alt="Equinor logo"/> */}
				{/* <img src="https://www.equinor.com/etc.clientlibs/statoil/clientlibs/clientlib/resources/images/page/equinor-logo.png" width="100" height="40" className="d-inline-block align-top" alt="Equinor logo"/> */}
				{/* <img src="/static/spider-1.gif" width="40" height="40" alt="spider" /> */}
			</a>
	</nav>
);

export default Navbar;

