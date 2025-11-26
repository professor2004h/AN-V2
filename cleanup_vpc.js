const { EC2Client, DeleteVpcCommand, DescribeVpcEndpointsCommand, DeleteVpcEndpointsCommand, DescribeRouteTablesCommand, DeleteRouteTableCommand, DeleteInternetGatewayCommand, DetachInternetGatewayCommand, DeleteSubnetCommand, DeleteSecurityGroupCommand, DescribeVpcsCommand, DescribeInternetGatewaysCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNetworkInterfacesCommand, DeleteNetworkInterfaceCommand } = require("@aws-sdk/client-ec2");

const client = new EC2Client({ region: process.argv[3] });
const vpcId = process.argv[2];

async function cleanupVpc() {
    console.log(`Starting cleanup for VPC ${vpcId}...`);

    try {
        // 1. Delete VPC Endpoints
        const endpoints = await client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
        if (endpoints.VpcEndpoints.length > 0) {
            const ids = endpoints.VpcEndpoints.map(e => e.VpcEndpointId);
            await client.send(new DeleteVpcEndpointsCommand({ VpcEndpointIds: ids }));
            console.log(`Deleted endpoints: ${ids.join(', ')}`);
        }

        // 2. Delete Internet Gateways
        const igws = await client.send(new DescribeInternetGatewaysCommand({ Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }] }));
        for (const igw of igws.InternetGateways) {
            await client.send(new DetachInternetGatewayCommand({ InternetGatewayId: igw.InternetGatewayId, VpcId: vpcId }));
            await client.send(new DeleteInternetGatewayCommand({ InternetGatewayId: igw.InternetGatewayId }));
            console.log(`Deleted IGW: ${igw.InternetGatewayId}`);
        }

        // 3. Delete Subnets (and interfaces)
        const subnets = await client.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
        for (const subnet of subnets.Subnets) {
            const interfaces = await client.send(new DescribeNetworkInterfacesCommand({ Filters: [{ Name: 'subnet-id', Values: [subnet.SubnetId] }] }));
            for (const iface of interfaces.NetworkInterfaces) {
                await client.send(new DeleteNetworkInterfaceCommand({ NetworkInterfaceId: iface.NetworkInterfaceId }));
                console.log(`Deleted Interface: ${iface.NetworkInterfaceId}`);
            }
            await client.send(new DeleteSubnetCommand({ SubnetId: subnet.SubnetId }));
            console.log(`Deleted Subnet: ${subnet.SubnetId}`);
        }

        // 4. Delete Route Tables (non-main)
        const rts = await client.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
        for (const rt of rts.RouteTables) {
            const isMain = rt.Associations.some(a => a.Main);
            if (!isMain) {
                // Dissociate first if needed (usually auto-dissociated when subnet deleted)
                await client.send(new DeleteRouteTableCommand({ RouteTableId: rt.RouteTableId }));
                console.log(`Deleted Route Table: ${rt.RouteTableId}`);
            }
        }

        // 5. Delete Security Groups (non-default)
        const sgs = await client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
        for (const sg of sgs.SecurityGroups) {
            if (sg.GroupName !== 'default') {
                try {
                    await client.send(new DeleteSecurityGroupCommand({ GroupId: sg.GroupId }));
                    console.log(`Deleted Security Group: ${sg.GroupId}`);
                } catch (e) {
                    console.log(`Retrying SG delete later: ${sg.GroupId}`);
                }
            }
        }

        // 6. Delete VPC
        await client.send(new DeleteVpcCommand({ VpcId: vpcId }));
        console.log(`Successfully deleted VPC: ${vpcId}`);

    } catch (error) {
        console.error("Error cleaning up VPC:", error);
        process.exit(1);
    }
}

cleanupVpc();
