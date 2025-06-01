/*!

=========================================================
* Vision UI Free React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-react
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-react/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import React from 'react';
import VuiBox from 'components/VuiBox';
import VuiTypography from 'components/VuiTypography';
import GreenLightning from './assets/images/shapes/green-lightning.svg';
import WhiteLightning from './assets/images/shapes/white-lightning.svg';
import carProfile from './assets/images/shapes/car-profile.svg';
import LineChart from 'examples/Charts/LineCharts/LineChart';
import { lineChartDataProfile1, lineChartDataProfile2 } from 'variables/charts';
import { lineChartOptionsProfile2, lineChartOptionsProfile1 } from 'variables/charts';

const CarInformations = () => {
	return (
		<div style={{
			borderRadius: '20px',
			background: 'rgba(255,255,255,0.08)',
			backdropFilter: 'blur(10px)',
			boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
			padding: '32px',
			margin: '0 auto',
			maxWidth: '1000px',
			color: '#fff',
			marginBottom: '32px'
		}}>
			<div style={{ display: 'flex', flexDirection: 'column' }}>
				<h2 style={{ fontWeight: 'bold', marginBottom: 6 }}>Car Informations</h2>
				<div style={{ color: '#bbb', marginBottom: 30 }}>Hello, Mark Johnson! Your Car is ready.</div>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 220 }}>
						<div style={{ position: 'relative', display: 'inline-flex', marginBottom: 16 }}>
							<svg width="170" height="170">
								<circle cx="85" cy="85" r="80" stroke="#00C6FF" strokeWidth="10" fill="none" opacity="0.2" />
								<circle cx="85" cy="85" r="80" stroke="#00C6FF" strokeWidth="10" fill="none" strokeDasharray={2*Math.PI*80} strokeDashoffset={2*Math.PI*80*0.4} style={{ transition: 'stroke-dashoffset 0.5s' }} />
							</svg>
							<div style={{ position: 'absolute', top: 0, left: 0, width: '170px', height: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
								<img src={GreenLightning} alt="Green Lightning" />
								<div style={{ fontSize: 32, fontWeight: 'bold', margin: '6px 0 4px 0' }}>68%</div>
								<div style={{ color: '#bbb', fontSize: 14 }}>Current Load</div>
							</div>
						</div>
						<div style={{ textAlign: 'center', marginTop: 18 }}>
							<div style={{ fontWeight: 'bold', fontSize: 20 }}>0h 58 min</div>
							<div style={{ color: '#bbb', fontSize: 14 }}>Time to full charge</div>
						</div>
					</div>
					<div style={{ display: 'flex', flex: 2, flexWrap: 'wrap', gap: 24, minWidth: 300 }}>
						<div style={{ flex: 1, minWidth: 220, background: 'rgba(0,198,255,0.08)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', marginBottom: 12 }}>
							<div style={{ marginRight: 'auto' }}>
								<div style={{ color: '#bbb', fontSize: 14, marginBottom: 2 }}>Battery Health</div>
								<div style={{ fontWeight: 'bold', fontSize: 24 }}>76%</div>
							</div>
							<div style={{ background: '#00C6FF', borderRadius: 12, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<img src={carProfile} alt="Car" />
							</div>
						</div>
						<div style={{ flex: 1, minWidth: 220, background: 'rgba(0,198,255,0.08)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', marginBottom: 12 }}>
							<div style={{ marginRight: 'auto' }}>
								<div style={{ color: '#bbb', fontSize: 14, marginBottom: 2 }}>Efficiency</div>
								<div style={{ fontWeight: 'bold', fontSize: 24 }}>+20%</div>
							</div>
							<div style={{ maxHeight: 75 }}>
								<LineChart lineChartData={lineChartDataProfile1} lineChartOptions={lineChartOptionsProfile1} />
							</div>
						</div>
						<div style={{ flex: 1, minWidth: 220, background: 'rgba(0,198,255,0.08)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', marginBottom: 12 }}>
							<div style={{ marginRight: 'auto' }}>
								<div style={{ color: '#bbb', fontSize: 14, marginBottom: 2 }}>Consumption</div>
								<div style={{ fontWeight: 'bold', fontSize: 24 }}>163W/km</div>
							</div>
							<div style={{ background: '#00C6FF', borderRadius: 12, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<img src={WhiteLightning} alt="White Lightning" />
							</div>
						</div>
						<div style={{ flex: 1, minWidth: 220, background: 'rgba(0,198,255,0.08)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', marginBottom: 12 }}>
							<div style={{ marginRight: 'auto' }}>
								<div style={{ color: '#bbb', fontSize: 14, marginBottom: 2 }}>This Week</div>
								<div style={{ fontWeight: 'bold', fontSize: 24 }}>1.342km</div>
							</div>
							<div style={{ maxHeight: 75 }}>
								<LineChart lineChartData={lineChartDataProfile2} lineChartOptions={lineChartOptionsProfile2} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CarInformations;
